package com.lostfound.config;
 
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
 
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
 
@Component
public class JwtUtil {
 
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
 
    @Value("${app.jwt.secret}")
    private String jwtSecret;
 
    @Value("${app.jwt.expiration}")
    private long jwtExpiration;
 
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
 
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
 
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }
 
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }
 
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
 
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
 
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
 
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
 
    private SecretKey getSigningKey() {
        // ✅ Fixed: HMAC-SHA256 requires at least 32 bytes (256 bits).
        //    Using raw String.getBytes() works if the secret is long enough,
        //    but silently breaks if it's shorter. We pad/trim to exactly 32 bytes
        //    to guarantee a valid key regardless of secret length.
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = Arrays.copyOf(keyBytes, 32); // zero-pad to 32 bytes
        } else if (keyBytes.length > 32) {
            keyBytes = Arrays.copyOf(keyBytes, 32); // trim to 32 bytes
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}