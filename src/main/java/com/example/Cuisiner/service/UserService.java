package com.example.Cuisiner.service;

import com.example.Cuisiner.dto.UserDto;
import com.example.Cuisiner.model.User;
import java.util.List;

public interface UserService {
    void addUser(UserDto userDto);
    void addRoleToUser(String username, String roleName);
    User getUserByUsername(String username);
    User findUserById(Long id);
    List<User> getUsers();
}
