package com.lostfound.entity;
 
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
 
import java.time.LocalDateTime;
import java.util.List;
 
@Entity
@Table(name = "users")
public class User {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @NotBlank
    @Column(nullable = false)
    private String name;
 
    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;
 
    @NotBlank
    @Column(nullable = false)
    private String password;
 
    private String phone;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;
 
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
 
    // ✅ Fixed: Changed EAGER → LAZY on both collections.
    //    EAGER on collections triggers N+1 queries and can cause a recursive
    //    load loop (User → Items → User → Items...) that crashes login with
    //    a StackOverflowError or LazyInitializationException.
    @OneToMany(mappedBy = "reportedBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Item> items;
 
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> sentMessages;
 
    public enum Role { USER, ADMIN }
 
    // --- Constructors ---
    public User() {}
 
    public User(Long id, String name, String email, String password, String phone,
                Role role, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.createdAt = createdAt;
    }
 
    // --- Getters ---
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getPhone() { return phone; }
    public Role getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<Item> getItems() { return items; }
    public List<Message> getSentMessages() { return sentMessages; }
 
    // --- Setters ---
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setRole(Role role) { this.role = role; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setItems(List<Item> items) { this.items = items; }
    public void setSentMessages(List<Message> sentMessages) { this.sentMessages = sentMessages; }
 
    // --- Builder ---
    public static Builder builder() { return new Builder(); }
 
    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String password;
        private String phone;
        private Role role = Role.USER;
        private LocalDateTime createdAt;
 
        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder role(Role role) { this.role = role; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
 
        public User build() {
            User u = new User();
            u.id = this.id;
            u.name = this.name;
            u.email = this.email;
            u.password = this.password;
            u.phone = this.phone;
            u.role = this.role;
            u.createdAt = this.createdAt;
            return u;
        }
    }
}