package com.lostfound.repository;

import com.lostfound.entity.Item;
import com.lostfound.entity.Item.ItemType;
import com.lostfound.entity.Item.ItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findByType(ItemType type, Pageable pageable);

    Page<Item> findByTypeAndStatus(ItemType type, ItemStatus status, Pageable pageable);

    Page<Item> findByStatus(ItemStatus status, Pageable pageable);

    List<Item> findByReportedById(Long userId);

    // Count methods for stats
    long countByType(ItemType type);
    long countByStatus(ItemStatus status);
    long countByReportedById(Long userId);

    @Query("SELECT i FROM Item i WHERE " +
    	       "(:keyword IS NULL OR :keyword = '' OR " +
    	       "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
    	       "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
    	       "AND (:type IS NULL OR i.type = :type) " +
    	       "AND (:category IS NULL OR LOWER(i.category) = LOWER(:category)) " +
    	       "AND (:location IS NULL OR LOWER(i.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
    	       "AND i.status = com.lostfound.entity.Item.ItemStatus.ACTIVE")
    	Page<Item> searchItems(
    	    @Param("keyword") String keyword,
    	    @Param("type") ItemType type,
    	    @Param("category") String category,
    	    @Param("location") String location,
    	    Pageable pageable
    	);

    // ── Admin native-SQL delete helpers ──────────────────────────────────────
    // Native SQL bypasses Hibernate's session cache entirely — no stale state,
    // no "Row was updated or deleted by another transaction" errors.

    /** Delete a single item row directly (after its messages are cleared). */
    @Modifying
    @Query(value = "DELETE FROM items WHERE id = :itemId", nativeQuery = true)
    void hardDeleteById(@Param("itemId") Long itemId);

    /** Delete all items belonging to a user (after their messages are cleared). */
    @Modifying
    @Query(value = "DELETE FROM items WHERE reported_by = :userId", nativeQuery = true)
    void hardDeleteByUserId(@Param("userId") Long userId);

    /** Get item IDs for a user — used to clear their messages before item delete. */
    @Query(value = "SELECT id FROM items WHERE reported_by = :userId", nativeQuery = true)
    List<Long> findIdsByUserId(@Param("userId") Long userId);
}
