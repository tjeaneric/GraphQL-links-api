import {
  extendType,
  objectType,
  stringArg,
  nonNull,
  intArg,
  inputObjectType,
  enumType,
  arg,
  list,
} from 'nexus';
import { Prisma } from '@prisma/client';

export const LinkOrderByInput = inputObjectType({
  name: 'LinkOrderByInput',
  definition(t) {
    t.field('description', { type: Sort });
    t.field('url', { type: Sort });
    t.field('createdAt', { type: Sort });
  },
});

export const Sort = enumType({
  name: 'Sort',
  members: ['asc', 'desc'],
});

export const Feed = objectType({
  name: 'Feed',
  definition(t) {
    t.nonNull.list.nonNull.field('links', { type: Link }); // 1
    t.nonNull.int('count'); // 2
    t.id('id'); // 3
  },
});

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
    t.nonNull.field('feed', {
      type: 'Feed',
      args: {
        filter: stringArg(), //filtering
        skip: intArg(), // Pagination page
        take: intArg(), // Pagination limit
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
      },
      async resolve(parent, args, context) {
        const where = args.filter // 2
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};
        const links = await context.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
            | undefined,
        });

        const count = await context.prisma.link.count({ where }); // 2
        const id = `main-feed:${JSON.stringify(args)}`;

        return {
          // 4
          links,
          count,
          id,
        };
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
