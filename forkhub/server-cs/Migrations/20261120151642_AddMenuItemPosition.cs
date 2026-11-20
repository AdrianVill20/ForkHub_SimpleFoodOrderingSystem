using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ForkHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItemPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Position",
                table: "MenuItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                table: "MenuItems");
        }
    }
}
