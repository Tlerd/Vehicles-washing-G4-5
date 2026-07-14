package com.autowashpro.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.config.path}")
    private Resource firebaseResource;

    @PostConstruct
    public void initFirebase() {
        try {
            if (!firebaseResource.exists()) {
                log.warn("WARNING: Firebase service account file was not found at {}. Firebase features will not be available, but application startup continues.", firebaseResource.getDescription());
                return;
            }
            InputStream serviceAccount = firebaseResource.getInputStream();
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully.");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK", e);
            log.warn("WARNING: Firebase Admin SDK initialization skipped due to IOException: {}", e.getMessage());
        }
    }
}
