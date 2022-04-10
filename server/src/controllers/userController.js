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
 * @api {get} /api/allUsers Get All Users (Admin only)
 * @apiName getAllUsers
 * @apiGroup userController
 * @apiDescription Get All Users (Admin only).
 * @apiPermission admin
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiSuccess {Object[]} allUsers Array of all users, formatted.
 * @apiError notAuthorized Requesting user is not admin.
 */
const getAllUsers = (req, res, models) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield models.User.findAll();
    if (users) {
        const formattedUsers = users.map((user) => {
            return {
                username: user.username,
                id: user.id
            };
        });
        return res.status(200).json({
            success: true,
            msg: 'userFetchingSuccessful',
            allUsers: formattedUsers
        });
    }
    else {
        return res.status(200).json({
            success: true,
            msg: 'noUsers',
            allUsers: []
        });
    }
});
export default { getAllUsers };
