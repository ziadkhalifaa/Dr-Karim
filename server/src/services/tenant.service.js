import { models } from "../models/index.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";

const { Tenant } = models;

let cache = null;

export const tenantService = {
  async resolve(slug) {
    const key = slug || "dr-kareem";
    let row = cache && cache.slug === key ? cache.row : null;
    if (row) return row;
    row = await Tenant.findOne({ where: { slug: key }, attributes: ["id", "slug", "name"], raw: true });
    cache = { slug: key, row };
    return row;
  },
  reset() {
    cache = null;
  },
  async resolveOrThrow(slug) {
    const row = await this.resolve(slug);
    if (!row) throw new AppError(404, ERROR_CODES.TENANT_NOT_FOUND, `Unknown tenant: ${slug}`);
    return row;
  },
  async resolveById(id) {
    const row = await Tenant.findByPk(id, { attributes: ["id", "slug", "name"], raw: true });
    if (!row) throw new AppError(404, ERROR_CODES.TENANT_NOT_FOUND, "Tenant not found");
    return row;
  },
};

export default tenantService;
