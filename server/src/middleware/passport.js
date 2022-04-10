var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import passport from 'passport';
import * as PassportLocal from 'passport-local';
const LocalStrategy = PassportLocal.Strategy;
import bcrypt from 'bcryptjs';
const configurePassport = (models, logger) => {
    /* The verify result is passed to the done function.
You have to make sure the return values are what passport expects.
Apart from that the implementation is up to you.
username & password params should be called exactly that.
Otherwise you must define a custom field mapping, see below. */
    const verifyCallback = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield models.User.findOne({
                where: {
                    username
                }
            });
            if (!user) {
                logger.log('info', `Failed login attempt: Non existent user: ${username}`);
                return done(null, false);
            }
            const isValid = yield bcrypt.compare(password, user.password);
            if (isValid) {
                logger.log('info', `Successful login by user: ${username} (${user.id})`);
                return done(null, user);
            }
            else {
                logger.log('info', `Failed login attempt: Wrong password for username: ${username}`);
                return done(null, false);
            }
        }
        catch (error) {
            return done(error);
        }
    });
    const strategy = new LocalStrategy(verifyCallback);
    passport.use(strategy);
    // Attach a user property with the user id as value to req.passport
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    // Attach req.user object
    passport.deserializeUser((userId, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield models.User.findOne({
                where: {
                    id: userId
                }
            });
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }));
    return passport;
};
export { configurePassport };
