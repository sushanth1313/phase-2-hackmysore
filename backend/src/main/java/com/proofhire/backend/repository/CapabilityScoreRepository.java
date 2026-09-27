package com.proofhire.backend.repository;
import com.proofhire.backend.model.CapabilityScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CapabilityScoreRepository extends JpaRepository<CapabilityScore, Long> {
    Optional<CapabilityScore> findByStudentId(Long studentId);
}
