var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { partyMetadataValidator } from '../common/validation.js';
/**
 * @api {put} /api/partyMetadata Update Party Metadata
 * @apiName updatePartyMetadata
 * @apiGroup partyMetadataController
 * @apiDescription Update Party Metadata (played state only atm).
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {Object} metadata New party metadata.
 * @apiParam {String} partyId ID of the party.
 * @apiSuccess metadataUpdateSuccessful Metadata was updated successfully.
 * @apiError notAuthorized Requesting user is not a member of the party / not admin or party is not active.
 */
const updatePartyMetadata = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    const partyId = req.body.partyId;
    const updatedMetadata = req.body.metadata;
    if (partyMetadataValidator.validate(updatedMetadata).error) {
        logger.log('info', `Validation error while submitting metadata: ${JSON.stringify(partyMetadataValidator.validate(updatedMetadata).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    const party = yield models.Party.findOne({ where: { id: partyId } });
    if (requestUser &&
        party.members.includes(requestUser.id) &&
        (party.status === 'active' || requestUser.role === 'admin')) {
        try {
            party.metadata = Object.assign(Object.assign({}, party.metadata), updatedMetadata);
            party.save();
            return res.status(200).json({
                success: true,
                msg: 'metadataUpdateSuccessful'
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
            msg: 'notAuthorized'
        });
    }
});
export default { updatePartyMetadata };
