package com.example.Cuisiner.service;

import com.example.Cuisiner.model.Role;
import java.util.List;

public interface RoleService {
    Role saveRole(Role Role);
    void addUserToRole(String username, String roleName);
    Role getRole(Role role);
    List<Role> getRoles();
}
