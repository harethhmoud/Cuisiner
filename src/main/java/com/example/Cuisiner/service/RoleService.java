package com.example.Cuisiner.service;

import com.example.Cuisiner.dto.RoleDto;
import com.example.Cuisiner.model.Role;
import java.util.List;

public interface RoleService {
    Role addRole(RoleDto roleDto);
    Role getRoleByName(String roleName);
    List<Role> getRoles();
}
