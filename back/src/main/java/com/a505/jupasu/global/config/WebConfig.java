package com.a505.jupasu.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadImagePath = Paths.get("uploads", "images").toAbsolutePath().toString();

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 브라우저가 /images/... 로 요청하면 실제 uploads/images/... 폴더를 보여줌
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + uploadImagePath + "/");
    }
}