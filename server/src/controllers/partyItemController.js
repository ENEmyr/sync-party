var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mediaItemValidator, partyMediaItemsValidator } from '../common/validation.js';
/**
 * @api {delete} /api/partyItems Remove Item From Party
 * @apiName removeItemFromParty
 * @apiGroup partyItemController
 * @apiDescription Removes an item from the party playlist. Removes played metadata as well.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {String} itemId ID of the item to be removed.
 * @apiParam {String} partyId ID of the party.
 * @apiSuccess removePartyItemSuccessful Item was successfully removed from the party.
 * @apiError notAuthorized Requesting user is not authorized or not a member of the party or party is not active.
 */
const removeItemFromParty = (req, res, models) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    const partyId = req.body.partyId;
    const itemId = req.body.itemId;
    const party = yield models.Party.findOne({ where: { id: partyId } });
    if (requestUser &&
        party.members.includes(requestUser.id) &&
        (party.status === 'active' || requestUser.role === 'admin')) {
        const newPartyItems = party.items.filter((item) => item !== itemId);
        party.items = newPartyItems;
        const newPartyMetadata = Object.assign({}, party.metadata);
        if (newPartyMetadata.played && newPartyMetadata.played[itemId]) {
            delete newPartyMetadata.played[itemId];
        }
        party.metadata = newPartyMetadata;
        yield party.save();
        return res.status(200).json({
            success: true,
            msg: 'removePartyItemSuccessful'
        });
    }
    else {
        return res.status(403).json({
            success: false,
            msg: 'notAuthorized'
        });
    }
});
/**
 * @api {post} /api/partyItems Add Item To Party
 * @apiName addItemToParty
 * @apiGroup partyItemController
 * @apiDescription Adds an item to the party playlist.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {Object} mediaItem MediaItem to be added.
 * @apiParam {String} partyId ID of the party.
 * @apiSuccess addItemSuccessful Item was added successfully.
 * @apiError notAuthorized Requesting user not a member of the party or party is not active.
 * @apiError itemAlreadyInParty Item is already in party.
 */
const addItemToParty = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    const partyId = req.body.partyId;
    const item = req.body.mediaItem;
    if (mediaItemValidator.validate(item).error) {
        logger.log('info', `Validation error while adding mediaItem to party: ${JSON.stringify(mediaItemValidator.validate(item).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    const party = yield models.Party.findOne({ where: { id: partyId } });
    if (requestUser &&
        party.members.includes(requestUser.id) &&
        (party.status === 'active' || requestUser.role === 'admin')) {
        const newPartyItems = [...party.items];
        if (!newPartyItems.includes(item.id)) {
            newPartyItems.push(item.id);
            party.items = newPartyItems;
            party.save();
            return res.status(200).json({
                success: true,
                msg: 'addItemSuccessful'
            });
        }
        else {
            return res.status(400).json({
                success: false,
                msg: 'itemAlreadyInParty'
            });
        }
    }
    else {
        return res.status(403).json({
            success: false,
            msg: 'notAuthorized'
        });
    }
});
/**
 * @api {put} /api/partyItems Modify Party Playlist
 * @apiName updatePartyItems
 * @apiGroup partyItemController
 * @apiDescription Modify Party Playlist order.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {Object[]} orderedItems Party MediaItems in new order.
 * @apiParam {String} partyId ID of the party.
 * @apiSuccess itemsUpdateSuccessful Items were updated successfully.
 * @apiError notAuthorized Requesting user is not authorized or not a member of the party or party is not active.
 */
const updatePartyItems = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    const partyId = req.body.partyId;
    const updatedItems = req.body.orderedItems;
    if (partyMediaItemsValidator.validate(updatedItems).error) {
        logger.log('info', `Validation error while updating mediaItems: ${JSON.stringify(partyMediaItemsValidator.validate(updatedItems).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    const party = yield models.Party.findOne({ where: { id: partyId } });
    if (requestUser &&
        party.members.includes(requestUser.id) &&
        (party.status === 'active' || requestUser.role === 'admin')) {
        try {
            party.items = updatedItems;
            party.save();
            return res.status(200).json({
                success: true,
                msg: 'itemsUpdateSuccessful'
            });
        }
        catch (error) {
            logger.log('error', error);
            return Promise.reject();
        }
    }
    else {
        return res.status(403).json({
            success: false,
            msg: 'Not authorized'
        });
    }
});
export default { removeItemFromParty, addItemToParty, updatePartyItems };
