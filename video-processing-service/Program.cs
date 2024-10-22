using video_processing_service;
using video_processing_service.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSingleton<StorageService>();
builder.Services.AddSingleton<FirestoreService>();

// Explicitly set the URL for the application
builder.WebHost.UseUrls("http://*:5185");

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseAuthorization();
app.MapControllers();

// setup storage directories
var storageService = app.Services.GetRequiredService<StorageService>();
storageService.SetupDirectories();

app.Run();
