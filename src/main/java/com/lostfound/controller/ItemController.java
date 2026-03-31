package com.lostfound.controller;

import com.lostfound.dto.ItemDto;
import com.lostfound.entity.Item.ItemStatus;
import com.lostfound.entity.Item.ItemType;
import com.lostfound.service.ItemService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ItemDto.Response> createItem(
            @RequestParam("title")                        String title,
            @RequestParam(value = "description",  required = false) String description,
            @RequestParam("type")                         ItemType type,
            @RequestParam(value = "category",     required = false) String category,
            @RequestParam(value = "location",     required = false) String location,
            @RequestParam(value = "dateLostFound",required = false) String dateLostFound,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "contactPhone", required = false) String contactPhone,
            @RequestParam(value = "image",        required = false) MultipartFile image) {

        ItemDto.CreateRequest request = new ItemDto.CreateRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setType(type);
        request.setCategory(category);
        request.setLocation(location);
        if (dateLostFound != null && !dateLostFound.isEmpty()) {
            try {
                request.setDateLostFound(java.time.LocalDate.parse(dateLostFound));
            } catch (Exception e) {
                throw new RuntimeException("Invalid date format. Use YYYY-MM-DD");
            }
        }
        request.setContactEmail(contactEmail);
        request.setContactPhone(contactPhone);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itemService.createItem(request, image));
    }

    @GetMapping
    public ResponseEntity<Page<ItemDto.Response>> getAllItems(
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "10")   int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(itemService.getAllItems(type, status, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ItemDto.Response>> searchItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(itemService.searchItems(keyword, type, category, location, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemDto.Response> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ItemDto.Response>> getMyItems() {
        return ResponseEntity.ok(itemService.getMyItems());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemDto.Response> updateItem(
            @PathVariable Long id,
            @RequestBody ItemDto.UpdateRequest request) {
        return ResponseEntity.ok(itemService.updateItem(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}