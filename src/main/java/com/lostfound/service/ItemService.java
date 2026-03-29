package com.lostfound.service;
 
import com.lostfound.dto.ItemDto;
import com.lostfound.entity.Item;
import com.lostfound.entity.Item.ItemStatus;
import com.lostfound.entity.Item.ItemType;
import com.lostfound.entity.User;
import com.lostfound.exception.ResourceNotFoundException;
import com.lostfound.exception.UnauthorizedException;
import com.lostfound.repository.ItemRepository;
import com.lostfound.repository.MessageRepository;
import com.lostfound.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
 
@Service
public class ItemService {
 
    private final ItemRepository    itemRepository;
    private final MessageRepository messageRepository;
    private final UserRepository    userRepository;
 
    // ✅ Fixed: removed hardcoded Windows path 'C:/MiniProject/...' as fallback.
    //    On Render (Linux) that path never exists and image saves silently fail.
    //    The correct default matches application.properties: /tmp/uploads/
    @Value("${app.upload.dir:/tmp/uploads/}")
    private String uploadDir;
 
    public ItemService(ItemRepository itemRepository,
                       MessageRepository messageRepository,
                       UserRepository userRepository) {
        this.itemRepository    = itemRepository;
        this.messageRepository = messageRepository;
        this.userRepository    = userRepository;
    }
 
    // ── Create ────────────────────────────────────────────
    public ItemDto.Response createItem(ItemDto.CreateRequest request, MultipartFile image) {
        User currentUser = getCurrentUser();
 
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = saveImage(image);
        }
 
        Item item = Item.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .category(request.getCategory())
                .location(request.getLocation())
                .dateLostFound(request.getDateLostFound())
                .imageUrl(imageUrl)
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .reportedBy(currentUser)
                .build();
 
        return mapToResponse(itemRepository.save(item));
    }
 
    private String saveImage(MultipartFile image) {
        try {
            // Ensure upload directory exists
            String dir = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
            File uploadDirFile = new File(dir).getAbsoluteFile();
            if (!uploadDirFile.exists()) {
                uploadDirFile.mkdirs();
            }
 
            String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
            File dest = new File(uploadDirFile, filename);
            image.transferTo(dest);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }
 
    // ── Read ──────────────────────────────────────────────
    public Page<ItemDto.Response> getAllItems(ItemType type, ItemStatus status, Pageable pageable) {
        if (type != null && status != null) {
            return itemRepository.findByTypeAndStatus(type, status, pageable).map(this::mapToResponse);
        } else if (type != null) {
            return itemRepository.findByType(type, pageable).map(this::mapToResponse);
        }
        return itemRepository.findAll(pageable).map(this::mapToResponse);
    }
 
    public Page<ItemDto.Response> searchItems(String keyword, ItemType type,
                                               String category, String location,
                                               Pageable pageable) {
        return itemRepository.searchItems(keyword, type, category, location, pageable)
                .map(this::mapToResponse);
    }
 
    public ItemDto.Response getItemById(Long id) {
        return mapToResponse(findItemOrThrow(id));
    }
 
    public List<ItemDto.Response> getMyItems() {
        User currentUser = getCurrentUser();
        return itemRepository.findByReportedById(currentUser.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }
 
    // ── Update ────────────────────────────────────────────
    @Transactional
    public ItemDto.Response updateItem(Long id, ItemDto.UpdateRequest request) {
        Item item        = findItemOrThrow(id);
        User currentUser = getCurrentUser();
 
        if (!item.getReportedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only update your own items");
        }
 
        if (request.getTitle()        != null) item.setTitle(request.getTitle());
        if (request.getDescription()  != null) item.setDescription(request.getDescription());
        if (request.getCategory()     != null) item.setCategory(request.getCategory());
        if (request.getLocation()     != null) item.setLocation(request.getLocation());
        if (request.getDateLostFound()!= null) item.setDateLostFound(request.getDateLostFound());
        if (request.getImageUrl()     != null) item.setImageUrl(request.getImageUrl());
        if (request.getContactEmail() != null) item.setContactEmail(request.getContactEmail());
        if (request.getContactPhone() != null) item.setContactPhone(request.getContactPhone());
        if (request.getStatus()       != null) item.setStatus(request.getStatus());
 
        return mapToResponse(itemRepository.save(item));
    }
 
    // ── Delete ────────────────────────────────────────────
    @Transactional
    public void deleteItem(Long id) {
        Item item        = findItemOrThrow(id);
        User currentUser = getCurrentUser();
 
        if (!item.getReportedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own items");
        }
 
        messageRepository.hardDeleteByItemId(id);
        itemRepository.hardDeleteById(id);
    }
 
    // ── Helpers ───────────────────────────────────────────
    private Item findItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }
 
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
 
    private ItemDto.Response mapToResponse(Item item) {
        return ItemDto.Response.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .type(item.getType())
                .status(item.getStatus())
                .category(item.getCategory())
                .location(item.getLocation())
                .dateLostFound(item.getDateLostFound())
                .imageUrl(item.getImageUrl())
                .contactEmail(item.getContactEmail())
                .contactPhone(item.getContactPhone())
                .reportedById(item.getReportedBy().getId())
                .reportedByName(item.getReportedBy().getName())
                .createdAt(item.getCreatedAt())
                .build();
    }
}