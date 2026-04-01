package com.lostfound.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(name = "is_read")
    private boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime sentAt;

    // --- Constructors ---
    public Message() {}

    // --- Getters ---
    public Long getId() { return id; }
    public String getContent() { return content; }
    public User getSender() { return sender; }
    public User getReceiver() { return receiver; }
    public Item getItem() { return item; }
    public boolean isRead() { return isRead; }
    public LocalDateTime getSentAt() { return sentAt; }

    // --- Setters ---
    public void setId(Long id) { this.id = id; }
    public void setContent(String content) { this.content = content; }
    public void setSender(User sender) { this.sender = sender; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    public void setItem(Item item) { this.item = item; }
    public void setRead(boolean read) { isRead = read; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    // --- Builder ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String content;
        private User sender;
        private User receiver;
        private Item item;
        private boolean isRead = false;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Builder sender(User sender) { this.sender = sender; return this; }
        public Builder receiver(User receiver) { this.receiver = receiver; return this; }
        public Builder item(Item item) { this.item = item; return this; }
        public Builder isRead(boolean isRead) { this.isRead = isRead; return this; }

        public Message build() {
            Message m = new Message();
            m.id = this.id;
            m.content = this.content;
            m.sender = this.sender;
            m.receiver = this.receiver;
            m.item = this.item;
            m.isRead = this.isRead;
            return m;
        }
    }
}
