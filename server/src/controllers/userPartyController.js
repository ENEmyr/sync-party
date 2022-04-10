var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Op } from 'sequelize';
/**
 * @api {get} /api/userParties Get All User Parties
 * @apiName getUserParties
 * @apiGroup userPartyController
 * @apiDescription Return parties the user is member in. Used all the time, e.g. when party is updated. Same result for admin or users. Parties are formatted: Some information about the other users is added etc.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiSuccess {Object[]} userParties All media items.
 */
const getUserParties = (req, res, models) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    if (requestUser && requestUser.id) {
        const allParties = yield models.Party.findAll();
        // Restrict parties to those where given user is member
        const userParties = allParties.filter((party) => {
            // @ts-ignore FIXME
            return party.members.includes(requestUser.id);
        });
        // Get lists of ALL users & items of bespoke parties (later assigned to specific party)
        const userPartiesMemberList = [];
        const userPartiesItemList = [];
        userParties.forEach((userParty) => {
            userParty.members.forEach((member) => {
                if (!userPartiesMemberList.includes(member)) {
                    userPartiesMemberList.push(member);
                }
            });
            userParty.items.forEach((item) => {
                if (!userPartiesItemList.includes(item)) {
                    userPartiesItemList.push(item);
                }
            });
        });
        // Get all formatted users (only id & username) & complete items for all parties this user is member of
        const userPartiesMembers = yield models.User.findAll({
            attributes: ['id', 'username'],
            where: {
                id: {
                    [Op.in]: userPartiesMemberList
                }
            }
        });
        const userPartiesItems = yield models.MediaItem.findAll({
            where: {
                id: {
                    [Op.in]: userPartiesItemList
                }
            }
        });
        // Create final user parties array with respective members & items
        const formattedUserParties = userParties.map((userParty) => {
            return {
                id: userParty.id,
                owner: userParty.owner,
                name: userParty.name,
                status: userParty.status,
                members: userPartiesMembers.filter((member) => {
                    return userParty.members.includes(member.id);
                }),
                items: userParty.items
                    .filter((itemId) => userPartiesItems.find((item) => item.id === itemId))
                    .map((itemId) => {
                    return userPartiesItems.find((item) => item.id === itemId);
                }),
                metadata: userParty.metadata || {},
                settings: userParty.settings || {}
            };
        });
        return res.status(200).json({
            success: true,
            msg: '',
            userParties: formattedUserParties
        });
    }
    else {
        return res.status(400).json({ success: false });
    }
});
export default { getUserParties };
