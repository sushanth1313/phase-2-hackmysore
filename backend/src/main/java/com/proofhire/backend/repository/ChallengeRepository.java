package com.proofhire.backend.repository;
import com.proofhire.backend.model.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {}
