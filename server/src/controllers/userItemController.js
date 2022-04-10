var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @api {get} /api/userItems Get User MediaItems
 * @apiName getUserItems
 * @apiGroup userItemController
 * @apiDescription Get all mediaItems owned by the user.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiSuccess {Object[]} userItems MediaItems owned by requesting user.
 */
const getUserItems = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const userItems = yield models.MediaItem.findAll({
            where: {
                owner: userId
            }
        });
        return res.status(200).json({
            success: true,
            msg: 'fetchingSuccessful',
            userItems
        });
    }
    catch (error) {
        logger.log('error', error);
        return res.status(500).json({
            success: false,
            msg: 'error'
        });
    }
});
export default { getUserItems };
