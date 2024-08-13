package com.example.Cuisiner.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@RequiredArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    @ManyToMany(fetch = FetchType.EAGER) // access "Role" entities as soon as "User" entity is loaded.
    @JoinTable(
            name = "user_roles", // joined table name
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id") // references role's primary key.
    )
    private Set<Role> roles = new HashSet<>(); // field that holds collection of Role entities linked to this user.
    // Set ensures no duplicate roles.

}
