import Cocoa
import FlutterMacOS
import macos_window_utils

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let macOSWindowUtilsViewController = MacOSWindowUtilsViewController(
      flutterViewController: flutterViewController
    )
    let windowFrame = self.frame
    self.contentViewController = macOSWindowUtilsViewController
    self.setFrame(windowFrame, display: true)
    MainFlutterWindowManipulator.start(mainFlutterWindow: self)

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()

    if let appDelegate = NSApp.delegate as? AppDelegate {
      appDelegate.connectMainWindow(
        self,
        flutterViewController: flutterViewController
      )
    }
  }
}
