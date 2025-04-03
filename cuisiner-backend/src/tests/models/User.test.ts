import mongoose from 'mongoose';
import { User, IUser } from '../../models/User';
import '@jest/globals';

describe('User Model Test', () => {
  // Test data
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    authProvider: 'local' as const
  };

  // Test 1: Create a user with valid data
  it('should create a user with valid data', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();
    
    // Make sure we got a valid ID for this user
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(validUserData.username);
    expect(savedUser.email).toBe(validUserData.email);
    
    // Password should be hashed, not the original password
    expect(savedUser.password).not.toBe(validUserData.password);
    
    // Default values
    expect(savedUser.following.length).toBe(0);
    expect(savedUser.followers.length).toBe(0);
    expect(savedUser.savedRecipes.length).toBe(0);
  });

  // Test 2: Username validation
  it('should not create a user without username', async () => {
    const userWithoutUsername = new User({
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    let validationError;
    try {
      await userWithoutUsername.validate();
    } catch (error: any) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.username).toBeDefined();
  });

  // Test 3: Username length validation
  it('should not create a user with too short username', async () => {
    const userWithShortUsername = new User({
      username: 'abc', // Less than 4 characters
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    let validationError;
    try {
      await userWithShortUsername.validate();
    } catch (error: any) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.username).toBeDefined();
  });

  // Test 4: Email validation
  it('should not create a user with invalid email', async () => {
    const userWithInvalidEmail = new User({
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123!'
    });
    
    let validationError;
    try {
      await userWithInvalidEmail.validate();
    } catch (error: any) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.email).toBeDefined();
  });

  // Test 5: Password validation - length
  it('should not create a user with a short password', async () => {
    const userWithShortPassword = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Pass1!'  // Less than 8 characters
    });
    
    let validationError;
    try {
      await userWithShortPassword.validate();
    } catch (error: any) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.password).toBeDefined();
  });

  // Test 6: Password validation - complexity
  it('should not create a user with a simple password', async () => {
    const testSimplePassword = async (password: string) => {
      const userWithSimplePassword = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: password
      });
      
      let validationError;
      try {
        await userWithSimplePassword.validate();
      } catch (error: any) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
    };
    
    // Test missing uppercase
    await testSimplePassword('password123!');
    
    // Test missing lowercase
    await testSimplePassword('PASSWORD123!');
    
    // Test missing number
    await testSimplePassword('Password!');
    
    // Test missing special character
    await testSimplePassword('Password123');
  });

  // Test 7: Password hashing middleware
  it('should hash the password on save', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();
    
    // Password should be hashed and different from original
    expect(savedUser.password).not.toBe(validUserData.password);
    expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/); // Matches bcrypt hash pattern
  });

  // Test 8: comparePassword method
  it('should correctly compare passwords', async () => {
    const user = new User(validUserData);
    await user.save();
    
    // Correct password should return true
    const isMatch = await user.comparePassword(validUserData.password);
    expect(isMatch).toBe(true);
    
    // Incorrect password should return false
    const isWrongMatch = await user.comparePassword('wrongpassword');
    expect(isWrongMatch).toBe(false);
  });

  // Test 9: Bio length validation
  it('should not allow bio longer than 500 characters', async () => {
    const longBio = 'a'.repeat(501); // 501 characters
    const userWithLongBio = new User({
      ...validUserData,
      bio: longBio
    });
    
    let validationError;
    try {
      await userWithLongBio.validate();
    } catch (error: any) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.bio).toBeDefined();
  });

  // Test 10: Default values
  it('should set default values correctly', async () => {
    const user = new User(validUserData);
    expect(user.profilePicture).toBe('');
    expect(user.bio).toBe('');
    expect(user.authProvider).toBe('local');
    expect(user.following).toEqual([]);
    expect(user.followers).toEqual([]);
    expect(user.savedRecipes).toEqual([]);
  });
}); 