const { v4: uuidv4 } = require('uuid');
const db = require('../db/knex');
const { encrypt, decrypt } = require('./encryption.service');

/**
 * Generate a deterministic conversation ID for two users.
 */
function getConversationId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    // Use a simple hash to create a consistent conversation ID
    return sorted.join('-');
}

/**
 * Send a message (encrypted at rest).
 */
async function sendMessage(senderId, recipientId, content) {
    const { encrypted, iv, tag } = encrypt(content);
    const conversationId = getConversationId(senderId, recipientId);

    const [message] = await db('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: recipientId,
            content: encrypted,
            content_iv: iv,
            content_tag: tag,
        })
        .returning('*');

    // Return with decrypted content for the response
    message.content = content;
    return message;
}

/**
 * List conversations for a user.
 */
async function listConversations(userId) {
    const conversations = await db('messages')
        .where('sender_id', userId)
        .orWhere('recipient_id', userId)
        .distinctOn('conversation_id')
        .orderBy('conversation_id')
        .orderBy('created_at', 'desc')
        .select('*');

    // Decrypt latest message in each conversation and get participant info
    const result = [];
    for (const msg of conversations) {
        const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const otherUser = await db('users')
            .select('id', 'first_name', 'last_name', 'role')
            .where({ id: otherUserId })
            .first();

        const unreadCount = await db('messages')
            .where({ conversation_id: msg.conversation_id, recipient_id: userId, is_read: false })
            .count('* as count')
            .first();

        result.push({
            conversation_id: msg.conversation_id,
            other_user: otherUser,
            last_message: {
                content: decrypt(msg.content, msg.content_iv, msg.content_tag),
                sender_id: msg.sender_id,
                created_at: msg.created_at,
            },
            unread_count: parseInt(unreadCount.count, 10),
        });
    }

    return result;
}

/**
 * Get conversation history (decrypted).
 */
async function getConversation(conversationId, userId) {
    const messages = await db('messages')
        .where({ conversation_id: conversationId })
        .where(function () {
            this.where('sender_id', userId).orWhere('recipient_id', userId);
        })
        .orderBy('created_at', 'asc')
        .select('*');

    return messages.map((msg) => ({
        ...msg,
        content: decrypt(msg.content, msg.content_iv, msg.content_tag),
    }));
}

/**
 * Mark a message as read.
 */
async function markAsRead(messageId, userId) {
    const [message] = await db('messages')
        .where({ id: messageId, recipient_id: userId })
        .update({ is_read: true })
        .returning('*');

    return message;
}

module.exports = { sendMessage, listConversations, getConversation, markAsRead, getConversationId };
