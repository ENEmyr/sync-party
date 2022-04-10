var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const updatePartyItems = (models, partyId, mediaItemId) => __awaiter(void 0, void 0, void 0, function* () {
    const party = yield models.Party.findOne({ where: { id: partyId } });
    const newPartyItems = [...party.items];
    if (!newPartyItems.includes(mediaItemId)) {
        newPartyItems.push(mediaItemId);
        party.items = newPartyItems;
        party.save();
        return Promise.resolve();
    }
    else {
        return Promise.reject(new Error('Item already in party'));
    }
});
const insertNewMediaItem = (req, newMediaItem, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestPartyId = req.body.partyId;
    const requestParty = yield models.Party.findOne({
        where: { id: requestPartyId }
    });
    if (requestParty &&
        req.user &&
        req.user.id === newMediaItem.owner &&
        requestParty.members.includes(req.user.id) &&
        newMediaItem.name !== '' &&
        newMediaItem.url !== '' &&
        (requestParty.status === 'active' || req.user.role === 'admin')) {
        try {
            const dbMediaItem = yield models.MediaItem.create(newMediaItem);
            yield updatePartyItems(models, requestParty.id, dbMediaItem.id);
            return Promise.resolve(true);
        }
        catch (error) {
            logger.log('error', error);
            return Promise.reject();
        }
    }
    else {
        logger.log('error', 'error creating new mediaItem');
        return Promise.reject();
    }
});
export { updatePartyItems, insertNewMediaItem };
