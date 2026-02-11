#import <UIKit/UIKit.h>

@class RCTRootViewFactory;

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) RCTRootViewFactory *rootViewFactory;

@end

