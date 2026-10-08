let posts = [
  {
    id: 1,
    title: 'First Post',
    content: 'This is the first post',
    likes: 0
  },
  {
    id: 2,
    title: 'Second Post',
    content: 'This is the second post',
    likes: 0
  },
  {
    id: 3,
    title: 'Third Post',
    content: 'This is the third post',
    likes: 0
  },
  {
    id: 4,
    title: 'Fourth Post',
    content: 'This is the fourth post',
    likes: 0
  },
  {
    id: 5,
    title: 'Fifth Post',
    content: 'This is the fifth post',
    likes: 0
  }
];

let nextId = 6;

function getAll() {
  return posts;
}

function getById(id) {
  return posts.find(post => post.id === Number(id));
}

function create(data) {
  const post = {
    id: nextId++,
    title: data.title,
    content: data.content,
    likes: 0
  };

  posts.push(post);

  return post;
}

function like(id) {
  const post = getById(id);

  if (post) {
    post.likes += 1;
  }

  return post;
}

module.exports = {
  getAll,
  getById,
  create,
  like
};