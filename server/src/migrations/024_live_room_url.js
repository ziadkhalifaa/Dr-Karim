import { DataTypes } from "sequelize";
export async function up(q) { await q.addColumn("video_meeting", "external_room_url", { type: DataTypes.STRING(255), allowNull: true }); }
export async function down(q) { await q.removeColumn("video_meeting", "external_room_url"); }
