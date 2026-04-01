package com.lostfound.service;

import com.lostfound.dto.MessageDto;
import com.lostfound.entity.Item;
import com.lostfound.entity.Message;
import com.lostfound.entity.User;
import com.lostfound.exception.ResourceNotFoundException;
import com.lostfound.repository.ItemRepository;
import com.lostfound.repository.MessageRepository;
import com.lostfound.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          ItemRepository itemRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
    }

    public MessageDto.Response sendMessage(MessageDto.SendRequest request) {
        User sender = getCurrentUser();
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        Item item = null;
        if (request.getItemId() != null) {
            item = itemRepository.findById(request.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        }

        Message message = Message.builder()
                .content(request.getContent())
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

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private MessageDto.Response mapToResponse(Message message) {
        return MessageDto.Response.builder()
                .id(message.getId())
                .content(message.getContent())
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
