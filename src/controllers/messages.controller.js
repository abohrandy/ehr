const messagesService = require('../services/messages.service');
const multer = require('multer');
const path = require('path');
const config = require('../config');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.upload.dir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: config.upload.maxFileSize },
});

async function send(req, res, next) {
    try {
        const message = await messagesService.sendMessage(
            req.user.id,
            req.body.recipient_id,
            req.body.content
        );
        res.status(201).json({ success: true, data: message });
    } catch (err) { next(err); }
}

async function listConversations(req, res, next) {
    try {
        const conversations = await messagesService.listConversations(req.user.id);
        res.json({ success: true, data: conversations });
    } catch (err) { next(err); }
}

async function getConversation(req, res, next) {
    try {
        const messages = await messagesService.getConversation(req.params.id, req.user.id);
        res.json({ success: true, data: messages });
    } catch (err) { next(err); }
}

async function markAsRead(req, res, next) {
    try {
        const message = await messagesService.markAsRead(req.params.id, req.user.id);
        res.json({ success: true, data: message });
    } catch (err) { next(err); }
}

async function uploadAttachment(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }
        res.json({
            success: true,
            data: {
                filename: req.file.filename,
                original_name: req.file.originalname,
                size: req.file.size,
                path: req.file.path,
            },
        });
    } catch (err) { next(err); }
}

module.exports = { send, listConversations, getConversation, markAsRead, uploadAttachment, upload };
