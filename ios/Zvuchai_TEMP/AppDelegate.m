#import "AppDelegate.h"

#import <React/RCTRootViewFactory.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBundleURLBlock bundleURLBlock = ^NSURL * {
    #if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
    #else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    #endif
  };
  
  RCTRootViewFactoryConfiguration *configuration = [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleURLBlock newArchEnabled:YES];
  self.rootViewFactory = [[RCTRootViewFactory alloc] initWithConfiguration:configuration];
  
  UIView *rootView = [self.rootViewFactory viewWithModuleName:@"Zvuchai_TEMP" initialProperties:nil launchOptions:launchOptions];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

@end

