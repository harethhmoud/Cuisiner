package com.example.Cuisiner.dto;

import lombok.RequiredArgsConstructor;
import lombok.Data;

@Data
@RequiredArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String password;
}
