package com.proofhire.backend.repository;
import com.proofhire.backend.model.ResumeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, Long> {
    List<ResumeVersion> findByStudentId(Long studentId);
}
