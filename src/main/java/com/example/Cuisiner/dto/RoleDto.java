package com.example.Cuisiner.dto;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Data
@RequiredArgsConstructor
public class RoleDto {
    private Long id;
    private String name;
}
