package com.lostfound.config;
 
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
 
@Configuration
public class WebConfig implements WebMvcConfigurer {
 
    // On Render, app.upload.dir=/tmp/uploads/ (set in application.properties)
    // Default removed the hardcoded Windows path
    @Value("${app.upload.dir:/tmp/uploads/}")
    private String uploadDir;
 
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ensure the path ends with a slash for proper resource resolution
        String location = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + location);
    }
}