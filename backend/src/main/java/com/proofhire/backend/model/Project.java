package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private String title;
    private String repositoryUrl;
    @Column(columnDefinition = "TEXT") private String description;
    private LocalDateTime createdAt;
    private String verificationStatus; // PENDING, VERIFIED, MODIFIED, FAILED
    
    public Project() {}
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRepositoryUrl() { return repositoryUrl; }
    public void setRepositoryUrl(String repositoryUrl) { this.repositoryUrl = repositoryUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
}
