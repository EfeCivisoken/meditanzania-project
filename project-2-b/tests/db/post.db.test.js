const { sequelize, Post, Facility, User, Municipality } = require('../../models');
const { beforeAll, afterAll, describe, test, expect } = require('@jest/globals');

describe('Post Model', () => {
  let facility, user, municipality;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    municipality = await Municipality.create({
      name: 'Test Municipality'
    });

    facility = await Facility.create({
      name: 'Test Facility',
      municipalityId: municipality.id
    });

    user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedpassword',
      type: 'admin'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a post with valid content, facilityId, and userId', async () => {
    const post = await Post.create({
      content: 'This is a test post.',
      facilityId: facility.id,
      userId: user.id
    });

    expect(post).toBeDefined();
    expect(post.content).toBe('This is a test post.');
    expect(post.facilityId).toBe(facility.id);
    expect(post.userId).toBe(user.id);
  });

  test('should not allow null content', async () => {
    await expect(Post.create({
      facilityId: facility.id,
      userId: user.id
    })).rejects.toThrow();
  });

  test('should associate with Facility and User', async () => {
    const post = await Post.create({
      content: 'Association test',
      facilityId: facility.id,
      userId: user.id
    });

    const fetchedPost = await Post.findByPk(post.id, {
      include: ['facility', 'user']
    });

    expect(fetchedPost.facility).toBeDefined();
    expect(fetchedPost.facility.id).toBe(facility.id);
    expect(fetchedPost.user).toBeDefined();
    expect(fetchedPost.user.id).toBe(user.id);
  });
});
