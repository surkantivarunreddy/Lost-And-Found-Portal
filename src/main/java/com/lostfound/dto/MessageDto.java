package com.lostfound.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class MessageDto {

    // ── Send Request ──────────────────────────────────────────
    public static class SendRequest {
        @NotBlank(message = "Message content is required")
        private String content;

        @NotNull(message = "Receiver ID is required")
        private Long receiverId;

        private Long itemId;

        public SendRequest() {}

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Long getReceiverId() { return receiverId; }
        public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
    }

    // ── Response ──────────────────────────────────────────────
    public static class Response {
        private Long id;
        private String content;
        private Long senderId;
        private String senderName;
        private Long receiverId;
        private String receiverName;
        private Long itemId;
        private String itemTitle;
        private boolean isRead;
        private LocalDateTime sentAt;

        public Response() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long senderId) { this.senderId = senderId; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        public Long getReceiverId() { return receiverId; }
        public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
        public String getReceiverName() { return receiverName; }
        public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public String getItemTitle() { return itemTitle; }
        public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }
        public boolean isRead() { return isRead; }
        public void setRead(boolean read) { isRead = read; }
        public LocalDateTime getSentAt() { return sentAt; }
        public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Long id;
            private String content;
            private Long senderId;
            private String senderName;
            private Long receiverId;
            private String receiverName;
            private Long itemId;
            private String itemTitle;
            private boolean isRead;
            private LocalDateTime sentAt;

            public Builder id(Long id) { this.id = id; return this; }
            public Builder content(String content) { this.content = content; return this; }
            public Builder senderId(Long senderId) { this.senderId = senderId; return this; }
            public Builder senderName(String senderName) { this.senderName = senderName; return this; }
            public Builder receiverId(Long receiverId) { this.receiverId = receiverId; return this; }
            public Builder receiverName(String receiverName) { this.receiverName = receiverName; return this; }
            public Builder itemId(Long itemId) { this.itemId = itemId; return this; }
            public Builder itemTitle(String itemTitle) { this.itemTitle = itemTitle; return this; }
            public Builder isRead(boolean isRead) { this.isRead = isRead; return this; }
            public Builder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }

            public Response build() {
                Response r = new Response();
                r.id = this.id; r.content = this.content;
                r.senderId = this.senderId; r.senderName = this.senderName;
                r.receiverId = this.receiverId; r.receiverName = this.receiverName;
                r.itemId = this.itemId; r.itemTitle = this.itemTitle;
                r.isRead = this.isRead; r.sentAt = this.sentAt;
                return r;
            }
        }
    }
}


