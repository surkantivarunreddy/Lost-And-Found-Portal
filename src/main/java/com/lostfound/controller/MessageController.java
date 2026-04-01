package com.lostfound.controller;

import com.lostfound.dto.MessageDto;
import com.lostfound.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<MessageDto.Response> sendMessage(
            @Valid @RequestBody MessageDto.SendRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendMessage(request));
    }

    @GetMapping
    public ResponseEntity<List<MessageDto.Response>> getMyMessages() {
        return ResponseEntity.ok(messageService.getMyMessages());
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageDto.Response>> getConversation(@PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getConversation(userId));
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<MessageDto.Response>> getItemMessages(@PathVariable Long itemId) {
        return ResponseEntity.ok(messageService.getItemMessages(itemId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        messageService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount()));
    }
}


