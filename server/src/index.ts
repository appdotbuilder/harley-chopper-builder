import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  createChopperStyleInputSchema,
  createPartCategoryInputSchema,
  createPartInputSchema,
  getPartsByCategoryInputSchema,
  createBuildGuideStepInputSchema,
  createUserBuildInputSchema,
  updateUserBuildInputSchema,
  getUserBuildsInputSchema,
  getPublicBuildsInputSchema,
  getBuildDetailsInputSchema,
  createBuildPartInputSchema,
  getEducationalContentInputSchema,
  createEducationalContentInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getChopperStyles } from './handlers/get_chopper_styles';
import { createChopperStyle } from './handlers/create_chopper_style';
import { getPartCategories } from './handlers/get_part_categories';
import { createPartCategory } from './handlers/create_part_category';
import { getParts } from './handlers/get_parts';
import { getPartsByCategory } from './handlers/get_parts_by_category';
import { createPart } from './handlers/create_part';
import { getBuildGuideSteps } from './handlers/get_build_guide_steps';
import { createBuildGuideStep } from './handlers/create_build_guide_step';
import { createUserBuild } from './handlers/create_user_build';
import { getUserBuilds } from './handlers/get_user_builds';
import { getPublicBuilds } from './handlers/get_public_builds';
import { updateUserBuild } from './handlers/update_user_build';
import { getBuildDetails } from './handlers/get_build_details';
import { addPartToBuild } from './handlers/add_part_to_build';
import { getEducationalContent } from './handlers/get_educational_content';
import { createEducationalContent } from './handlers/create_educational_content';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Chopper styles (educational content)
  getChopperStyles: publicProcedure
    .query(() => getChopperStyles()),
  
  createChopperStyle: publicProcedure
    .input(createChopperStyleInputSchema)
    .mutation(({ input }) => createChopperStyle(input)),

  // Part categories
  getPartCategories: publicProcedure
    .query(() => getPartCategories()),
  
  createPartCategory: publicProcedure
    .input(createPartCategoryInputSchema)
    .mutation(({ input }) => createPartCategory(input)),

  // Parts management
  getParts: publicProcedure
    .query(() => getParts()),
  
  getPartsByCategory: publicProcedure
    .input(getPartsByCategoryInputSchema)
    .query(({ input }) => getPartsByCategory(input)),
  
  createPart: publicProcedure
    .input(createPartInputSchema)
    .mutation(({ input }) => createPart(input)),

  // Build guide
  getBuildGuideSteps: publicProcedure
    .query(() => getBuildGuideSteps()),
  
  createBuildGuideStep: publicProcedure
    .input(createBuildGuideStepInputSchema)
    .mutation(({ input }) => createBuildGuideStep(input)),

  // User builds (configurator/visualizer)
  createUserBuild: publicProcedure
    .input(createUserBuildInputSchema)
    .mutation(({ input }) => createUserBuild(input)),
  
  getUserBuilds: publicProcedure
    .input(getUserBuildsInputSchema)
    .query(({ input }) => getUserBuilds(input)),
  
  getPublicBuilds: publicProcedure
    .input(getPublicBuildsInputSchema)
    .query(({ input }) => getPublicBuilds(input)),
  
  updateUserBuild: publicProcedure
    .input(updateUserBuildInputSchema)
    .mutation(({ input }) => updateUserBuild(input)),
  
  getBuildDetails: publicProcedure
    .input(getBuildDetailsInputSchema)
    .query(({ input }) => getBuildDetails(input)),
  
  addPartToBuild: publicProcedure
    .input(createBuildPartInputSchema)
    .mutation(({ input }) => addPartToBuild(input)),

  // Educational content
  getEducationalContent: publicProcedure
    .input(getEducationalContentInputSchema)
    .query(({ input }) => getEducationalContent(input)),
  
  createEducationalContent: publicProcedure
    .input(createEducationalContentInputSchema)
    .mutation(({ input }) => createEducationalContent(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Harley Chopper Build App TRPC server listening at port: ${port}`);
}

start();