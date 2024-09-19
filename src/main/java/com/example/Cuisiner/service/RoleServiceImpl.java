package com.example.Cuisiner.service;

import com.example.Cuisiner.dto.RoleDto;
import com.example.Cuisiner.exception.RoleNotFoundException;
import com.example.Cuisiner.model.Role;
import com.example.Cuisiner.repository.RoleRepository;
import com.example.Cuisiner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService{
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Override
    public Role addRole(RoleDto roleDto){
        Role role = new Role();
        role.setName(roleDto.getName());
        return roleRepository.save(role);
    }

    @Override
    public Role getRoleByName(String roleName){
        return roleRepository.findByName(roleName).orElseThrow(() -> new RoleNotFoundException("Role not found."));
    }

    @Override
    public List<Role> getRoles(){
        return roleRepository.findAll();
    }




}
