import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:aboccrim_mobile/main.dart';
import 'package:aboccrim_mobile/providers/auth_provider.dart';

void main() {
  testWidgets('ABOCCRIM app initializes properly', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final authProvider = AuthProvider();
    await tester.pumpWidget(AboccrimApp(authProvider: authProvider));
    expect(find.text('ABOCCRIM'), findsWidgets);
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
  });
}
