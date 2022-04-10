var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from 'bcryptjs';
const createUser = (models, username, role, passwordRaw) => __awaiter(void 0, void 0, void 0, function* () {
    const user = {};
    const passwordHashed = bcrypt.hashSync(passwordRaw, 10);
    const existed = yield models.User.findOne({ where: { username: username } });
    if (existed) {
        console.log(`User ${username} already exists.`);
        return false;
    }
    else {
        user.username = username;
        user.password = passwordHashed;
        user.role = role;
        const newUser = yield models.User.create(user);
        console.log(`User ${username} created`);
        console.log(newUser.dataValues, 'Your new user');
        return true;
    }
});
const deleteUser = (models, username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield models.User.findOne({ where: { username } });
        if (!user) {
            console.log(`No user found with username: ${username}. Exiting`);
            return;
        }
        user.destroy();
        console.log(`User deleted: ${username} (id: ${user.id})`);
    }
    catch (error) {
        console.log(error);
    }
});
const listUsers = (models) => __awaiter(void 0, void 0, void 0, function* () {
    const allUsers = yield models.User.findAll();
    if (allUsers.length === 0) {
        return Promise.reject(new Error('No users found'));
    }
    else {
        return allUsers;
    }
});
const deleteAllUsers = (models) => __awaiter(void 0, void 0, void 0, function* () {
    yield models.User.destroy({ where: {}, truncate: true });
    console.log('All users deleted.');
});
const changePassword = (models, username, newPasswordRaw) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models.User.findOne({ where: { username } });
    if (!user) {
        throw new Error(`User ${username} does not exist!`);
    }
    const newPasswordHashed = yield bcrypt.hash(newPasswordRaw, 10);
    user.password = newPasswordHashed;
    yield models.User.update({ password: newPasswordHashed }, { where: { username } });
});
export { createUser, deleteUser, listUsers, deleteAllUsers, changePassword };
