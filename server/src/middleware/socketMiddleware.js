// https://github.com/jfromaniello/passport.socketio/issues/148
export const authenticateSocketRequest = (io, session, passport) => {
    const socketIoWrap = (middleware) => {
        return (socket, next) => {
            return middleware(socket.request, {}, next);
        };
    };
    io.use(socketIoWrap(session));
    io.use(socketIoWrap(passport.initialize()));
    io.use(socketIoWrap(passport.session()));
    io.use((socket, next) => {
        // @ts-ignore
        if (socket.request.user) {
            next();
        }
        else {
            next(new Error('unauthorized'));
        }
    });
};
