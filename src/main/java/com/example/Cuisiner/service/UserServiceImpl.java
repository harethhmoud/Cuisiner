package com.example.Cuisiner.service;

import com.example.Cuisiner.dto.UserDto;
import com.example.Cuisiner.exception.RoleNotFoundException;
import com.example.Cuisiner.exception.UserNotFoundException;
import com.example.Cuisiner.model.Role;
import com.example.Cuisiner.model.User;
import com.example.Cuisiner.repository.RoleRepository;
import com.example.Cuisiner.repository.UserRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public void addUser(UserDto userDto){
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setPassword(userDto.getPassword());
        userRepository.save(user);
    }

    @Override
    public User findUserById(Long id){
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException("User not found."));
    }

    @Override
    public void addRoleToUser(String username, String roleName) {
        User user = getUserByUsername(username);
        Role role = roleRepository.findByName(roleName).orElseThrow(() -> new RoleNotFoundException("Role not found."));
        user.getRoles().add(role);
        userRepository.save(user);
    }

    public User getUserByUsername(String username){
        return userRepository.findByUsername(username).orElseThrow(() -> new UserNotFoundException("User not found."));
    }

    public List<User> getUsers(){
        return userRepository.findAll();
    }


}
