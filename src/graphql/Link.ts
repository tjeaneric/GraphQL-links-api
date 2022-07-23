import { extendType, objectType, stringArg, nonNull, intArg } from 'nexus';

export const Link = objectType({
  name: 'Link', // 1
  definition(t) {
    // 2
    t.nonNull.string('id'); // 3
    t.nonNull.string('description'); // 4
    t.nonNull.string('url'); // 5
    t.nonNull.dateTime('createdAt'); // 1
    t.field('postedBy', {
      // 1
      type: 'User',
      resolve(parent, args, context) {
        // 2
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .postedBy();
      },
    });

    t.nonNull.list.nonNull.field('voters', {
      // 1
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .voters();
      },
    });
  },
});

export const LinkQuery = extendType({
  // 2
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('feed', {
      type: 'Link',
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
      },
      resolve(parent, args, context) {
        const where = args.filter // 2
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};
        return context.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
        });
      },
    });

    t.field('link', {
      type: 'Link',
      args: { id: nonNull(stringArg()) },
      resolve(parent, args, context) {
        return context.prisma.link.findUnique({
          where: { id: args.id },
        });
      },
    });
  },
});

export const LinkMutation = extendType({
  // 1
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('post', {
      // 2
      type: 'Link',
      args: {
        // 3
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        const { description, url } = args;
        const { userId } = context;

        if (!userId) {
          // 1
          throw new Error('Cannot post without logging in.');
        }

        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } }, // 2
          },
        });

        return newLink;
      },
    });

    t.nonNull.field('updateLink', {
      // 2
      type: 'Link',
      args: {
        // 3
        id: nonNull(stringArg()),
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        return context.prisma.link.update({
          where: { id: args.id },
          data: {
            description: args.description,
            url: args.url,
          },
        });
      },
    });

    t.field('deleteLink', {
      // 2
      type: 'Link',
      args: {
        // 3
        id: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        return context.prisma.link.delete({
          where: { id: args.id },
        });
      },
    });
  },
});
