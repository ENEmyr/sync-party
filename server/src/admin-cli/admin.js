var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Sequelize } from 'sequelize';
import createModels from '../database/createModels.js';
import { createUser, deleteUser, listUsers, deleteAllUsers, changePassword } from './operations.js';
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '../../db'
});
const models = createModels(sequelize);
const mode = process.argv[2].trim();
if ([
    'create-user',
    'delete-user',
    'list-users',
    'delete-all-users',
    'change-password'
].includes(mode) === false) {
    console.log(mode);
    console.log('Not a valid mode.');
    process.exit(1);
}
const runAdminCli = () => __awaiter(void 0, void 0, void 0, function* () {
    if (mode === 'create-user') {
        if (!process.argv[3] || !process.argv[4]) {
            console.log('Username & password must be specified after mode arg. Exiting.');
            process.exit(1);
        }
        let role = 'user';
        if (process.argv[5] === 'admin') {
            role = 'admin';
        }
        const username = process.argv[3];
        const passwordRaw = process.argv[4];
        createUser(models, username, role, passwordRaw);
    }
    if (mode === 'delete-user') {
        if (!process.argv[3]) {
            console.log('Specify username');
            return;
        }
        const username = process.argv[3];
        yield deleteUser(models, username);
        console.log(`User ${username} deleted.`);
    }
    if (mode === 'list-users') {
        const allUsers = yield listUsers(models);
        console.log(JSON.stringify(allUsers, null, 4));
    }
    if (mode === 'delete-all-users') {
        yield deleteAllUsers(models);
        console.log('All users deleted.');
    }
    if (mode === 'change-password') {
        if (!process.argv[3] || !process.argv[4]) {
            console.log('Username & new password must be specified after mode arg. Exiting.');
            process.exit(1);
        }
        const username = process.argv[3];
        const newPasswordRaw = process.argv[4];
        yield changePassword(models, username, newPasswordRaw);
    }
});
runAdminCli().catch((err) => {
    console.log(err);
});
