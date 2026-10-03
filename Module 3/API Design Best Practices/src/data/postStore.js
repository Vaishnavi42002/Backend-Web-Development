let posts = [
  {
    id: 1,
    title: 'First Post',
    content: 'This is the first post'
  },
  {
    id: 2,
    title: 'Second Post',
    content: 'This is the second post'
  },
  {
    id: 3,
    title: 'Third Post',
    content: 'This is the third post'
  },
  {
    id: 4,
    title: 'Fourth Post',
    content: 'This is the fourth post'
  },
  {
    id: 5,
    title: 'Fifth Post',
    content: 'This is the fifth post'
  }
];

let nextId = 6;

function getAll() {
  return posts;
}

function getById(id) {
  return posts.find(
    post => post.id === Number(id)
  );
}

function create(data) {
  const post = {
    id: nextId++,
    title: data.title,
    content: data.content
  };

  posts.push(post);

  return post;
}

function update(id, data) {
  const post = getById(id);

  if (data.title !== undefined) {
    post.title = data.title;
  }

  if (data.content !== undefined) {
    post.content = data.content;
  }

  return post;
}

function remove(id) {
  const numericId = Number(id);

  posts = posts.filter(
    post => post.id !== numericId
  );
}

function resetData() {
  posts = [
    {
      id: 1,
      title: 'First Post',
      content: 'This is the first post'
    },
    {
      id: 2,
      title: 'Second Post',
      content: 'This is the second post'
    },
    {
      id: 3,
      title: 'Third Post',
      content: 'This is the third post'
    },
    {
      id: 4,
      title: 'Fourth Post',
      content: 'This is the fourth post'
    },
    {
      id: 5,
      title: 'Fifth Post',
      content: 'This is the fifth post'
    }
  ];

  nextId = 6;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  resetData
};