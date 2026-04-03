package com.lostfound.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.lostfound.dto.MessageDto;
import com.lostfound.entity.Item;
import com.lostfound.entity.Message;
import com.lostfound.entity.User;
import com.lostfound.exception.ResourceNotFoundException;
import com.lostfound.exception.UnauthorizedException;
import com.lostfound.repository.ItemRepository;
import com.lostfound.repository.MessageRepository;
import com.lostfound.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository    userRepository;
    private final ItemRepository    itemRepository;
    private final Cloudinary        cloudinary;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          ItemRepository itemRepository,
                          Cloudinary cloudinary) {
        this.messageRepository = messageRepository;
        this.userRepository    = userRepository;
        this.itemRepository    = itemRepository;
        this.cloudinary        = cloudinary;
    }

    public MessageDto.Response sendMessage(MessageDto.SendRequest request) {
        User sender   = getCurrentUser();
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        Item item = null;
        if (request.getItemId() != null) {
            item = itemRepository.findById(request.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        }

        Message message = Message.builder()
                .content(request.getContent())
                .locationText(request.getLocationText())
                .sender(sender)
                .receiver(receiver)
                .item(item)
                .build();

        return mapToResponse(messageRepository.save(message));
    }

    public MessageDto.Response sendMessageWithMedia(Long receiverId, Long itemId,
                                                    String content, String locationText,
                                                    MultipartFile image) {
        User sender   = getCurrentUser();
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            try {
                Map uploadResult = cloudinary.uploader().upload(
                        image.getBytes(),
                        ObjectUtils.asMap("folder", "messages")
                );
                imageUrl = (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                throw new RuntimeException("Image upload failed: " + e.getMessage());
            }
        }

        Item item = null;
        if (itemId != null) {
            item = itemRepository.findById(itemId).orElse(null);
        }

        Message message = Message.builder()
                .content(content)
                .imageUrl(imageUrl)
                .locationText(locationText)
                .sender(sender)
                .receiver(receiver)
                .item(item)
                .build();

        return mapToResponse(messageRepository.save(message));
    }

    public List<MessageDto.Response> getMyMessages() {
        User currentUser = getCurrentUser();
        return messageRepository.findByUserId(currentUser.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<MessageDto.Response> getConversation(Long otherUserId) {
        User currentUser = getCurrentUser();
        return messageRepository.findConversation(currentUser.getId(), otherUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<MessageDto.Response> getItemMessages(Long itemId) {
        return messageRepository.findByItemId(itemId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        message.setRead(true);
        messageRepository.save(message);
    }

    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return messageRepository.countByReceiverIdAndIsReadFalse(currentUser.getId());
    }

    /**
     * Delete a single message — only the sender is allowed.
     */
    @Transactional
    public void deleteMessage(Long messageId) {
        User currentUser = getCurrentUser();
        Message message  = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own messages");
        }
        messageRepository.deleteById(messageId);
    }

    /**
     * Bulk delete — silently skips IDs that don't belong to the current user.
     */
    @Transactional
    public void deleteMessages(List<Long> ids) {
        User currentUser = getCurrentUser();
        List<Message> toDelete = messageRepository.findAllById(ids).stream()
                .filter(m -> m.getSender().getId().equals(currentUser.getId()))
                .collect(Collectors.toList());
        messageRepository.deleteAll(toDelete);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private MessageDto.Response mapToResponse(Message message) {
        return MessageDto.Response.builder()
                .id(message.getId())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .locationText(message.getLocationText())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getName())
                .itemId(message.getItem() != null ? message.getItem().getId() : null)
                .itemTitle(message.getItem() != null ? message.getItem().getTitle() : null)
                .isRead(message.isRead())
                .sentAt(message.getSentAt())
                .build();
    }
}