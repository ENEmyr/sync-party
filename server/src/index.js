var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { CronJob } from 'cron';
import { Sequelize } from 'sequelize';
import morgan from 'morgan';
import { Server as SocketIoServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import express from 'express';
import helmet, { contentSecurityPolicy } from 'helmet';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import sequelizeStoreInit from 'connect-session-sequelize';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { v4 as uuid } from 'uuid';
import { configurePassport } from './middleware/passport.js';
import configureSession from './middleware/session.js';
import rateLimiters from './middleware/rateLimiters.js';
import { isAuthenticated, isAdmin } from './middleware/auth.js';
import { authenticateSocketRequest } from './middleware/socketMiddleware.js';
import authController from './controllers/authController.js';
import fileController from './controllers/fileController.js';
import mediaItemController from './controllers/mediaItemController.js';
import userController from './controllers/userController.js';
import partyController from './controllers/partyController.js';
import partyItemController from './controllers/partyItemController.js';
import partyMetadataController from './controllers/partyMetadataController.js';
import userPartyController from './controllers/userPartyController.js';
import userItemController from './controllers/userItemController.js';
import externalDataController from './controllers/externalDataController.js';
import helpers from './common/helpers.js';
import createModels from './database/createModels.js';
const runApp = () => __awaiter(void 0, void 0, void 0, function* () {
    // Config
    dotenv.config();
    if (process.env.SERVER_PORT && process.env.WEBSOCKETS_PORT) {
        const port = parseInt(process.env.SERVER_PORT, 10) || 4000;
        const webRtcServerKey = uuid();
        // Init app
        const app = express();
        // LOGGING
        const logger = helpers.createLogger();
        app.use(morgan(
        // @ts-ignore
        ':remote-addr - :remote-user :method :url HTTP/:http-version :status :res[content-length] :referrer :user-agent - :response-time ms', { stream: logger.stream }));
        // Check environment variables
        helpers.envCheck(logger);
        // DATABASE
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './db',
            logging: false
        });
        const models = createModels(sequelize);
        try {
            yield sequelize.sync({ alter: true });
        }
        catch (error) {
            logger.log('error', error);
        }
        // HTTP(S) SERVER
        let server;
        server = http.createServer(app);
        // DEFAULT VALUES
        const persistentValues = fs.existsSync('./persistence.json')
            ? JSON.parse(fs.readFileSync('./persistence.json', 'utf-8'))
            : {
                currentPlayWishes: {},
                lastPositions: {}
            };
        const currentSyncStatus = {};
        const currentPlayWishes = persistentValues.currentPlayWishes;
        const lastPositions = persistentValues.lastPositions;
        new CronJob('*/15 * * * *', () => {
            fs.writeFileSync(path.join('./persistence.json'), JSON.stringify({
                currentPlayWishes,
                lastPositions
            }));
        }, null, false).start();
        // MIDDLEWARE
        const dir = contentSecurityPolicy.getDefaultDirectives();
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: contentSecurityPolicy.dangerouslyDisableDefaultSrc,
                    baseUri: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    scriptSrc: "'self' 'unsafe-inline' www.youtube.com s.ytimg.com player.vimeo.com w.soundcloud.com",
                    scriptSrcAttr: ["'none'"],
                    styleSrc: "'self' https: 'unsafe-inline'"
                }
            }
        }));
        app.use(compression());
        // HTTP HEADERS
        // TODO: Consider cors package
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
            res.header('Cross-Origin-Resource-Policy', 'cross-origin');
            res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, Content-Type, Accept, X-CSRF-Token');
            res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS, PUT');
            next();
        });
        // Static files middleware
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.resolve('client-build')));
        }
        // Parser middleware
        app.use(bodyParser.json());
        app.use(cookieParser(process.env.SESSION_SECRET));
        // Session & Auth
        const SequelizeStore = sequelizeStoreInit(expressSession.Store);
        const { session, sessionStore } = configureSession(sequelize, SequelizeStore, expressSession);
        app.use(session);
        const passport = configurePassport(models, logger);
        app.use(passport.initialize());
        app.use(passport.session());
        // TBI
        // app.use(
        //     csurf({
        //         cookie: { key: '_csrf', signed: false }
        //     })
        // );
        // CSRF Error Handler
        // app.use((err, req, res, next) => {
        //     if (err.code !== 'EBADCSRFTOKEN') return next(err);
        //     logger.log(
        //         'info',
        //         `Invalid CSRF token. User ID: ${
        //             req.user ? req.user.id : '(no session)'
        //         }`
        //     );
        //     return res.status(403).json({
        //         success: false,
        //         msg: 'csrfToken'
        //     });
        // });
        // WEBSOCKETS SERVER
        const io = new SocketIoServer({
            transports: ['websocket'],
            cors: process.env.NODE_ENV === 'development'
                ? {
                    origin: 'http://localhost:3000',
                    methods: ['GET']
                }
                : undefined
        });
        authenticateSocketRequest(io, session, passport);
        // Socket listeners
        io.on('connection', (socket) => {
            const socketUserId = socket.request.user.id;
            logger.log('info', `Web Sockets: New connection, userId: ${socketUserId}`);
            const joinParty = (data) => __awaiter(void 0, void 0, void 0, function* () {
                const members = yield io
                    .in(data.partyId)
                    .allSockets();
                if (!members.has(socketUserId)) {
                    try {
                        const party = yield models.Party.findOne({
                            where: {
                                id: data.partyId
                            }
                        });
                        if (!party || !party.members.includes(socketUserId)) {
                            return Promise.reject(new Error('User not member in party'));
                        }
                    }
                    catch (error) {
                        logger.log('error', error);
                    }
                    socket.join(data.partyId);
                    socket.emit('serverTimeOffset', Date.now() - data.timestamp);
                    logger.log('info', `Web Sockets: User ${socketUserId} joined party ${data.partyId}`);
                    if (currentPlayWishes[data.partyId]) {
                        socket.emit('playOrder', currentPlayWishes[data.partyId]);
                    }
                    return Promise.resolve();
                }
                else {
                    return Promise.reject(new Error('User already joined the party'));
                }
            });
            socket.on('joinParty', (data) => __awaiter(void 0, void 0, void 0, function* () {
                yield joinParty(data);
            }));
            socket.on('leaveParty', (data) => {
                socket.leave(data.partyId);
                logger.log('info', `Web Sockets: User ${socketUserId} left party ${data.partyId}`);
            });
            socket.on('playWish', (playWish) => {
                const playWishWithNormalizedTimestamp = Object.assign(Object.assign({}, playWish), { timestamp: playWish.timestamp + (Date.now() - playWish.timestamp) });
                // Save position of previous item, if delivered
                if (playWish.lastPosition &&
                    playWish.lastPosition.position > 0) {
                    if (!lastPositions[playWish.partyId]) {
                        lastPositions[playWish.partyId] = {};
                    }
                    lastPositions[playWish.partyId][playWish.lastPosition.itemId] = playWish.lastPosition.position;
                }
                // Attach last position of the requested item
                if (playWishWithNormalizedTimestamp.requestLastPosition &&
                    lastPositions[playWish.partyId] &&
                    lastPositions[playWish.partyId][playWishWithNormalizedTimestamp.mediaItemId]) {
                    playWishWithNormalizedTimestamp.lastPosition = {
                        itemId: playWishWithNormalizedTimestamp.mediaItemId,
                        position: lastPositions[playWishWithNormalizedTimestamp.partyId][playWishWithNormalizedTimestamp.mediaItemId]
                    };
                }
                else {
                    if (playWishWithNormalizedTimestamp.lastPosition) {
                        delete playWishWithNormalizedTimestamp.lastPosition;
                    }
                }
                currentPlayWishes[playWish.partyId] =
                    playWishWithNormalizedTimestamp;
                // Only emitted to party members
                io.to(playWish.partyId).emit('playOrder', playWishWithNormalizedTimestamp);
            });
            socket.on('partyUpdate', (partyUpdateData) => {
                // Update emitted to all connected users, in order to make sure dashboard is updated etc.
                io.emit('partyUpdate', partyUpdateData);
            });
            socket.on('mediaItemUpdate', (empty) => {
                // Update emitted to all connected users, in order to make sure dashboard is updated etc.
                io.emit('mediaItemUpdate', empty);
            });
            socket.on('syncStatus', (userSyncStatus) => {
                currentSyncStatus[userSyncStatus.partyId] =
                    currentSyncStatus[userSyncStatus.partyId] || {};
                currentSyncStatus[userSyncStatus.partyId][userSyncStatus.userId] = {
                    isPlaying: userSyncStatus.isPlaying,
                    timestamp: userSyncStatus.timestamp,
                    position: userSyncStatus.position,
                    serverTimeOffset: Date.now() - userSyncStatus.timestamp,
                    webRtc: userSyncStatus.webRtc
                };
                // Only emitted to party members
                io.to(userSyncStatus.partyId).emit('syncStatus', currentSyncStatus[userSyncStatus.partyId]);
            });
            socket.on('chatMessage', (chatMessage) => {
                io.to(chatMessage.partyId).emit('chatMessage', chatMessage);
            });
            // WebRTC
            socket.on('joinWebRtc', (data) => {
                io.to(data.partyId).emit('joinWebRtc', data.webRtcId);
            });
            socket.on('leaveWebRtc', (data) => {
                io.to(data.partyId).emit('leaveWebRtc', {
                    webRtcId: data.webRtcId
                });
            });
            // Disconnect
            socket.on('disconnect', (event) => {
                socket.leaveAll();
                logger.log('info', `Web Sockets: User disconnected: ${socketUserId}`);
            });
        });
        // WebRTC
        const peerServer = ExpressPeerServer(server, {
            // debug: true,
            proxied: process.env.NODE_ENV === 'production',
            key: webRtcServerKey
        });
        app.use('/peerjs', isAuthenticated, peerServer);
        peerServer.on('connection', (client) => __awaiter(void 0, void 0, void 0, function* () {
            const requestWebRtcId = client.id;
            const allParties = yield models.Party.findAll();
            let isInActiveParty = false;
            let userId = '';
            for (const party of allParties) {
                const partyWebRtcIds = party.settings.webRtcIds;
                if (partyWebRtcIds) {
                    for (const partyUserId of Object.keys(partyWebRtcIds)) {
                        const partyUserWebRtcId = partyWebRtcIds[partyUserId];
                        if (partyUserWebRtcId === requestWebRtcId ||
                            party.status === 'active') {
                            isInActiveParty = true;
                            userId = partyUserId;
                            break;
                        }
                    }
                }
                if (isInActiveParty) {
                    break;
                }
            }
            const user = yield models.User.findOne({
                where: { id: userId }
            });
            if (!isInActiveParty || !user) {
                client.socket.close();
                logger.log('error', `PeerJS: Client denied: ${requestWebRtcId}`);
                return;
            }
            logger.log('info', `PeerJS: client connected: ${requestWebRtcId} (userId: ${user.id}, username: ${user.username})`);
        }));
        peerServer.on('disconnect', (client) => {
            logger.log('info', `PeerJS: client disconnected: ${client.id}`);
        });
        // API Endpoints
        // Auth & login
        app.post('/api/auth', rateLimiters.authRateLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield authController.auth(req, res, logger);
        }));
        app.post('/api/login', rateLimiters.authRateLimiter, passport.authenticate('local'), (req, res) => {
            authController.login(req, res);
        });
        app.post('/api/logout', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield authController.logout(req, res, logger);
        }));
        app.post('/api/register', rateLimiters.authRateLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield authController.register(req, res, models);
        }));
        // WebRTC Key
        app.post('/api/webRtcServerKey', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const partyId = req.body.partyId;
            const userId = req.body.userId;
            const webRtcId = req.body.webRtcId;
            const party = yield models.Party.findOne({
                where: { id: partyId }
            });
            const user = yield models.User.findOne({
                where: { id: userId }
            });
            if (!party ||
                party.settings.webRtcIds[userId] !== webRtcId ||
                !party.members.includes(userId) ||
                !user) {
                return res.status(401);
            }
            return res.json({ webRtcServerKey });
        }));
        // MediaItems
        app.get('/api/allMediaItems', isAuthenticated, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield mediaItemController.getAllMediaItems(req, res, models, logger);
        }));
        app.post('/api/mediaItem', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield mediaItemController.createMediaItem(req, res, models, logger);
        }));
        app.put('/api/mediaItem/:id', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield mediaItemController.editMediaItem(req, res, models, logger);
        }));
        app.delete('/api/mediaItem/:id', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield mediaItemController.deleteMediaItem(req, res, models, logger);
        }));
        // UserItems
        app.get('/api/userItems', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield userItemController.getUserItems(req, res, models, logger);
        }));
        // Files
        app.get('/api/file/:id', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield fileController.getFile(req, res, models);
        }));
        app.post('/api/file', isAuthenticated, (req, res) => {
            fileController.upload(req, res, models, logger);
        });
        // Users
        app.get('/api/allUsers', isAuthenticated, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield userController.getAllUsers(req, res, models);
        }));
        // Parties
        app.post('/api/party', isAuthenticated, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyController.createParty(req, res, models, logger);
        }));
        app.put('/api/party', isAuthenticated, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyController.editParty(req, res, models, logger);
        }));
        // User Parties
        app.get('/api/userParties', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield userPartyController.getUserParties(req, res, models);
        }));
        // Party items
        app.delete('/api/partyItems', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyItemController.removeItemFromParty(req, res, models);
        }));
        app.post('/api/partyItems', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyItemController.addItemToParty(req, res, models, logger);
        }));
        app.put('/api/partyItems', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyItemController.updatePartyItems(req, res, models, logger);
        }));
        // Party metadata
        app.put('/api/partyMetadata', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield partyMetadataController.updatePartyMetadata(req, res, models, logger);
        }));
        // Data from external websites
        app.post('/api/linkMetadata', isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            yield externalDataController.getLinkMetadata(req, res, logger);
        }));
        // Route everything not caught by above routes to index.html
        if (process.env.NODE_ENV === 'production') {
            app.get('*', rateLimiters.indexRateLimiter, (req, res) => {
                res.sendFile(path.join(path.resolve('client-build'), 'index.html'));
            });
        }
        // Start Websockets server
        io.listen(parseInt(process.env.WEBSOCKETS_PORT, 10) || 5000);
        // Start server
        server.listen(port, () => {
            logger.log('info', `App listening on port ${port}`);
        });
    }
    else {
        throw new Error('Env variables are missing.');
    }
});
runApp().catch((error) => console.log(error));
