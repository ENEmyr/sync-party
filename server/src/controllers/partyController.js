var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { newPartyValidator, partyValidator } from '../common/validation.js';
import helpers from '../common/helpers.js';
import { v4 as uuid } from 'uuid';
/**
 * @api {post} /api/party Create New Party (Admin only)
 * @apiName createParty
 * @apiGroup partyController
 * @apiDescription Creates a new party
 * @apiPermission admin
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {String} partyName Name for the new party.
 * @apiSuccess createPartySuccessful Party was created successfully.
 * @apiError partyWithSameName A party with that name already exists.
 * @apiError notAuthorized Requesting user is not admin.
 */
const createParty = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    if (req.body.partyName !== '' && requestUser && requestUser.id) {
        try {
            const newParty = {
                owner: requestUser.id,
                name: req.body.partyName,
                status: 'active',
                members: [requestUser.id],
                items: [],
                metadata: {},
                settings: {
                    webRtcIds: helpers.createWebRtcIds([requestUser.id])
                }
            };
            if (newPartyValidator.validate(newParty).error) {
                logger.log('info', `Validation error while creating new party: ${JSON.stringify(newPartyValidator.validate(newParty).error)}`);
                return res
                    .status(400)
                    .json({ success: false, msg: 'validationError' });
            }
            const partyWithSameName = yield models.Party.findOne({
                where: { name: req.body.partyName }
            });
            if (!partyWithSameName) {
                yield models.Party.create(newParty);
                return res.status(200).json({
                    success: true,
                    msg: 'createPartySuccessful'
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    msg: 'partyWithSameName'
                });
            }
        }
        catch (error) {
            logger.log('error', error);
            return Promise.reject();
        }
    }
    else {
        return res.status(400).json({
            success: true,
            msg: 'missingFields'
        });
    }
});
/**
 * @api {put} /api/party Edit Party (Admin only)
 * @apiName editParty
 * @apiGroup partyController
 * @apiDescription Edits a party. Possibilities: Change party status; add member; remove member; delete party.
 * @apiPermission admin
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {Boolean} deleteParty Party is up for deletion.
 * @apiParam {Object} party Edited party.
 * @apiSuccess partyEditSuccessful Party was edited successfully.
 * @apiError notAuthorized Requesting user is not admin.
 */
const editParty = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteParty = req.body.deleteParty;
    const requestParty = req.body.party;
    const dbParty = yield models.Party.findOne({
        where: { id: requestParty.id }
    });
    // Recreate webRtcIds if party status changes
    if (dbParty.status !== requestParty.status) {
        requestParty.settings = Object.assign(Object.assign({}, requestParty.settings), { webRtcIds: helpers.createWebRtcIds(requestParty.members) });
    }
    if (dbParty.members.length !== requestParty.members.length) {
        if (!requestParty.settings.webRtcIds) {
            // Legacy: create webRtcIds if there are none
            requestParty.settings.webRtcIds = helpers.createWebRtcIds(requestParty.members);
        }
        // Generate a webRtcId if there is new member
        requestParty.members.forEach((member) => {
            if (!dbParty.members.includes(member)) {
                requestParty.settings.webRtcIds = Object.assign(Object.assign({}, requestParty.settings.webRtcIds), { [member]: uuid() });
            }
        });
        // Delete webRtcId if member is removed
        dbParty.members.forEach((member) => {
            if (!requestParty.members.includes(member)) {
                const newWebRtcIds = Object.assign({}, requestParty.settings.webRtcIds);
                delete newWebRtcIds[member];
                requestParty.settings.webRtcIds = newWebRtcIds;
            }
        });
    }
    if (partyValidator.validate(requestParty).error) {
        logger.log('info', `Validation error while editing party: ${JSON.stringify(partyValidator.validate(requestParty).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    try {
        if (deleteParty) {
            dbParty.destroy();
        }
        else {
            dbParty.status = requestParty.status;
            dbParty.members = requestParty.members;
            dbParty.settings = requestParty.settings;
            dbParty.save();
        }
        return res.status(200).json({
            success: true,
            msg: 'partyEditSuccessful'
        });
    }
    catch (error) {
        logger.log('error', error);
        return Promise.reject();
    }
});
export default { createParty, editParty };
